"use client";

import { useState, useEffect } from "react";
import {
  fetchCustomers,
  fetchFirstCustomerSubscription,
  createSubscription,
  Customer,
  cancelSubscription,
} from "@/lib/paystack";

const PLAN_CODE = "PLN_hn7hh4a4480fmp6";

const CustomerList = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null
  );
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | undefined>(undefined);
  const [code, setCode] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState<boolean>(true);
  const [subLoading, setSubLoading] = useState(false);

  useEffect(() => {
    const loadCustomers = async () => {
      setLoadingCustomers(true); // Start loading
      try {
        const fetchedCustomers = await fetchCustomers();
        setCustomers(fetchedCustomers);
      } catch (error) {
        setError("Failed to fetch customers. Please try again.");
        console.error(error);
      } finally {
        setLoadingCustomers(false); // Stop loading
      }
    };

    loadCustomers();
  }, []);

  const handleCustomerClick = async (customer: Customer) => {
    // Update the state to reflect the selected customer
    setSelectedCustomer(customer);
    setError(null);
    setSubLoading(true);

    try {
      // Use the customer argument directly instead of selectedCustomer
      const subscription = await fetchFirstCustomerSubscription(customer.id);
      setCode(subscription?.subscription_code);
      setToken(subscription?.email_token);

      if (subscription && subscription.status === "active") {
        setIsSubscribed(true);
      } else {
        setIsSubscribed(false);
      }
    } catch (error) {
      setError("Failed to check subscription status.");
      console.error(error);
    } finally {
      setSubLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!selectedCustomer) return;
    setIsLoading(true);

    try {
      const subscriptionCode = await createSubscription(
        selectedCustomer.customer_code,
        PLAN_CODE,
        selectedCustomer.email
      );

      if (subscriptionCode) {
        alert("Subscription successful!");
        setIsSubscribed(true);
      }
    } catch (error) {
      alert("Failed to subscribe. Please try again.");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!code || !token) {
      return;
    }
    setIsLoading(true);

    try {
      const success = await cancelSubscription(code, token);

      if (success) {
        alert("Subscription canceled successfully!");
        setIsSubscribed(false);
        // Update Firestore or local state if needed
      } else {
        alert("Failed to cancel subscription. Please try again.");
      }
    } catch (error) {
      console.error("Error canceling subscription:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-[26rem] mx-auto p-4 bg-gray-100 rounded shadow mt-8">
      <h2 className="text-xl font-bold mb-4">Customer List</h2>
      {error && <p className="text-red-500">{error}</p>}
      <ul className="space-y-2">
        {loadingCustomers ? (
          <p className="text-center text-gray-500">Loading customers...</p>
        ) : (
          <ul className="space-y-2">
            {customers.map((customer) => (
              <li
                key={customer.customer_code}
                className="p-2 border rounded cursor-pointer hover:bg-gray-200"
                onClick={() => handleCustomerClick(customer)}
              >
                <p className="font-medium">{customer.email}</p>
                <p className="text-sm text-gray-600">
                  {`${customer.first_name || ""} ${
                    customer.last_name || ""
                  }`.trim()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </ul>

      {selectedCustomer && (
        <div className="mt-4 p-4 border rounded bg-white">
          <h3 className="text-lg font-bold">Selected Customer</h3>
          <p>Email: {selectedCustomer.email}</p>
          <p>First Name: {selectedCustomer.first_name || "N/A"}</p>
          <p>Last Name: {selectedCustomer.last_name || "N/A"}</p>
          <p>Customer Code: {selectedCustomer.customer_code}</p>

          {subLoading ? (
            <p className="mt-4 w-full py-2 px-4 text-center">Please wait...</p>
          ) : (
            <button
              onClick={isSubscribed ? handleUnsubscribe : handleSubscribe}
              disabled={isLoading} // Disable the button while loading
              className={`mt-4 w-full py-2 px-4 rounded ${
                isLoading
                  ? "bg-gray-400 cursor-not-allowed"
                  : isSubscribed
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : "bg-blue-500 hover:bg-blue-600 text-white"
              }`}
            >
              {isLoading
                ? "Loading..."
                : isSubscribed
                ? "Unsubscribe"
                : "Subscribe"}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerList;
