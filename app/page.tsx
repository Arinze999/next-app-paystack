// page.tsx
import "./../errorInterceptor"; // Import the error interceptor
import AddEmailForm from "./components/AddEmailForm";
import EmailList from "./components/EmailList";

export default function Home() {
  return (
    <main className="flex flex-col justify-center items-center gap-10">
      <h2> Next Paystack Demo</h2>
      <AddEmailForm />
      <EmailList />
    </main>
  );
}
