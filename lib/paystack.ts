const PRIVATE_KEY = process.env.PAYSTACK_SECRET_KEY;

export const createCustomer = async (
  email: string,
  firstName: string,
  lastName: string,
  phone: string
): Promise<string> => {
  if (!PRIVATE_KEY) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not defined in the environment variables."
    );
  }

  try {
    const response = await fetch("https://api.paystack.co/customer", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PRIVATE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
      }),
    });

    const data = await response.json();

    if (response.ok && data.data && data.data.customer_code) {
      return data.data.customer_code; // Return the customer code
    } else {
      throw new Error(data.message || "Failed to create customer");
    }
  } catch (error) {
    console.error("Error creating customer:", error);
    throw new Error("An error occurred while creating the customer");
  }
};

export interface Customer {
  integration: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  phone: string | null;
  metadata: Record<string, any> | null;
  domain: string;
  customer_code: string;
  risk_action: string;
  id: number;
  createdAt: string;
  updatedAt: string;
}

export const fetchCustomers = async (): Promise<Customer[]> => {
  if (!PRIVATE_KEY) {
    throw new Error(
      "PAYSTACK_SECRET_KEY is not defined in the environment variables."
    );
  }

  try {
    const response = await fetch("https://api.paystack.co/customer", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PRIVATE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.ok && data.data) {
      return data.data as Customer[]; // Ensure the response matches the Customer type
    } else {
      throw new Error(data.message || "Failed to fetch customers");
    }
  } catch (error) {
    console.error("Error fetching customers:", error);
    throw new Error("An error occurred while fetching customers");
  }
};

export interface SubscriptionResponse {
  id: number;
  domain: string;
  status: string; // "active", "cancelled", etc.
  start: number;
  quantity: number;
  subscription_code: string;
  email_token: string;
  amount: number;
  cron_expression: string;
  next_payment_date: string | null; // ISO date string or null
  open_invoice: string | null; // null if no open invoice
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  integration: number;
  plan: PlanDetails;
  authorization: AuthorizationDetails;
  customer: CustomerDetails;
  invoice_limit: number;
  split_code: string | null; // Can be null if no split code
  payments_count: number;
  most_recent_invoice: InvoiceDetails | null; // null if no recent invoice
}

export interface PlanDetails {
  id: number;
  domain: string;
  name: string;
  plan_code: string;
  description: string;
  amount: number;
  interval: string; // "hourly", "monthly", etc.
  send_invoices: boolean;
  send_sms: boolean;
  currency: string; // Currency code like "NGN"
  integration: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

export interface AuthorizationDetails {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: string; // "card", etc.
  card_type: string; // e.g., "visa"
  bank: string; // e.g., "TEST BANK"
  country_code: string; // e.g., "NG"
  brand: string; // e.g., "visa"
  reusable: number; // 1 or 0
  signature: string;
  account_name: string | null; // null if not provided
}

export interface CustomerDetails {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  customer_code: string;
  phone: string | null; // Can be null if not provided
  metadata: string | null; // Can be null
  risk_action: string; // e.g., "default"
  international_format_phone: string | null; // Can be null
}

export interface InvoiceDetails {
  subscription: number;
  integration: number;
  domain: string;
  invoice_code: string;
  customer: number;
  transaction: number;
  amount: number;
  period_start: string; // ISO date string
  period_end: string; // ISO date string
  status: string; // e.g., "success"
  paid: number; // 1 if paid, 0 otherwise
  retries: number;
  authorization: number;
  paid_at: string; // ISO date string
  next_notification: string | null; // null if no next notification
  notification_flag: string | null; // null or other values
  description: string | null; // null if not provided
  id: number;
  created_at: string; // ISO date string
  updated_at: string; // ISO date string
}

export const createSubscription = async (
  customer: string,
  plan: string,
  email: string
): Promise<string | void> => {
  try {
    // Attempt to create the subscription
    const subscriptionResponse = await fetch(
      "https://api.paystack.co/subscription",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PRIVATE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customer, plan }),
      }
    );

    const subscriptionData = await subscriptionResponse.json();

    if (subscriptionResponse.ok && subscriptionData.data) {
      // Return the subscription code if successful
      return subscriptionData.data.subscription_code;
    } else if (
      subscriptionData.code === "no_active_authorizations_for_customer" &&
      subscriptionData.meta.nextStep
    ) {
      // Handle the case where there's no saved authorization
      console.log("Initializing payment...");

      const initializeResponse = await fetch(
        "https://api.paystack.co/transaction/initialize",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${PRIVATE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            plan,
            amount: 0, // Explicitly set the amount to 0 to use the plan's predefined amount
          }),
        }
      );

      const initializeData = await initializeResponse.json();

      if (initializeResponse.ok && initializeData.data) {
        // Redirect the customer to complete payment
        window.location.href = initializeData.data.authorization_url;
        return; // Stop further execution as payment is pending
      } else {
        throw new Error(
          initializeData.message || "Failed to initialize payment"
        );
      }
    } else {
      // Handle other errors returned from the subscription API
      throw new Error(
        subscriptionData.message || "Failed to create subscription"
      );
    }
  } catch (error) {
    // Log and rethrow the error for further handling
    console.error("Error creating subscription:", error);
    throw new Error("An error occurred while creating the subscription");
  }
};

export const fetchFirstCustomerSubscription = async (
  customerId?: number
): Promise<SubscriptionResponse | null> => {
  try {
    // Validate that customer is provided
    if (!customerId) {
      throw new Error("Customer code is required to fetch subscriptions.");
    }

    // Construct the URL with the customer code
    const url = `https://api.paystack.co/subscription?customer=${customerId}`;

    // Fetch subscription data from Paystack
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${PRIVATE_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (response.ok && data.data && data.data.length > 0) {
    //   console.log("Subscription status:", data.data[0]);
      return data.data[0] as SubscriptionResponse; // Return the first subscription
    } else {
      console.warn("No subscriptions found for the provided customer.");
      return null; // No subscriptions found
    }
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    throw new Error("An error occurred while fetching subscriptions");
  }
};

export const cancelSubscription = async (
  subscriptionCode: string,
  emailToken: string
): Promise<boolean> => {
  try {
    const response = await fetch(
      "https://api.paystack.co/subscription/disable",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PRIVATE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          code: subscriptionCode,
          token: emailToken,
        }),
      }
    );

    const data = await response.json();

    if (response.ok && data.status) {
      console.log("Subscription canceled successfully:", data);
      return true;
    } else {
      console.error("Failed to cancel subscription:", data.message);
      return false;
    }
  } catch (error) {
    console.error("Error canceling subscription:", error);
    throw new Error("An error occurred while canceling the subscription.");
  }
};
