// errorInterceptor.js
const originalError = console.error;

console.error = (...args) => {
  if (args[0]?.includes("A tree hydrated but some attributes")) {
    // Suppress this specific hydration warning
    return;
  }
  originalError(...args);
};
