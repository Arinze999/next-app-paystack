"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { createCustomer } from "@/lib/paystack"; // Import the createCustomer function

const generateRandomEmail = () => {
  const emailDomains = [
    "example.com",
    "testmail.com",
    "demo.com",
    "mailinator.com",
  ];
  const randomName = `user${Math.floor(Math.random() * 10000)}`;
  const randomDomain =
    emailDomains[Math.floor(Math.random() * emailDomains.length)];
  return `${randomName}@${randomDomain}`;
};

const generateRandomFirstName = () => {
  const firstNames = [
    "John",
    "Jane",
    "Alex",
    "Emily",
    "Chris",
    "Taylor",
    "Jordan",
    "Morgan",
    "Ryan",
    "Sophia",
    "Ethan",
    "Ava",
    "Noah",
    "Mia",
    "Liam",
    "Isabella",
    "Jacob",
    "Olivia",
    "Daniel",
    "Emma",
  ];
  return firstNames[Math.floor(Math.random() * firstNames.length)];
};

const generateRandomLastName = () => {
  const lastNames = [
    "Smith",
    "Johnson",
    "Brown",
    "Taylor",
    "Anderson",
    "Thomas",
    "Jackson",
    "White",
    "Harris",
    "Martin",
    "Thompson",
    "Garcia",
    "Martinez",
    "Robinson",
    "Clark",
    "Rodriguez",
    "Lewis",
    "Lee",
    "Walker",
    "Hall",
  ];
  return lastNames[Math.floor(Math.random() * lastNames.length)];
};

const generateRandomPhone = () =>
  `080${Math.floor(10000000 + Math.random() * 90000000)}`;

const AddEmailForm = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  // Prefill the fields with random data on mount
  useEffect(() => {
    setEmail(generateRandomEmail());
    setFirstName(generateRandomFirstName());
    setLastName(generateRandomLastName());
    setPhone(generateRandomPhone());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMessage("Please enter a valid email.");
      return;
    }

    if (!firstName || !lastName || !phone) {
      setMessage("Please fill in all the fields.");
      return;
    }

    try {
      // Create Paystack customer and get customer code
      const customerCode = await createCustomer(
        email,
        firstName,
        lastName,
        phone
      );

      // Save customer details to Firestore
      const docRef = doc(collection(db, "emails"), email);
      await setDoc(docRef, {
        email,
        firstName,
        lastName,
        phone,
        subscriptionStatus: false,
        customerCode, // Save the customer code from Paystack
      });

      setMessage("Customer added successfully!");
      setEmail(generateRandomEmail());
      setFirstName(generateRandomFirstName());
      setLastName(generateRandomLastName());
      setPhone(generateRandomPhone());
    } catch (error) {
      console.error("Error adding customer:", error);
      setMessage("Failed to add customer. Try again.");
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 bg-gray-100 rounded shadow">
      <form onSubmit={handleSubmit}>
        <label htmlFor="email" className="block text-lg font-medium mb-2">
          Email
        </label>
        <input
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          placeholder="example@example.com"
        />

        <label htmlFor="firstName" className="block text-lg font-medium mb-2">
          First Name
        </label>
        <input
          type="text"
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          placeholder="First Name"
        />

        <label htmlFor="lastName" className="block text-lg font-medium mb-2">
          Last Name
        </label>
        <input
          type="text"
          id="lastName"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          placeholder="Last Name"
        />

        <label htmlFor="phone" className="block text-lg font-medium mb-2">
          Phone
        </label>
        <input
          type="text"
          id="phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mb-4"
          placeholder="Phone Number"
        />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Add Customer
        </button>
      </form>
      <p className="mt-4 text-center text-sm">
        {message || <span className="opacity-0">Placeholder</span>}
      </p>
    </div>
  );
};

export default AddEmailForm;
