import { useState } from 'react';

interface GreetingProps {
  messages: string[];
}

export default function Greeting({ messages }: GreetingProps) {
  const [greeting, setGreeting] = useState(messages[0]);

  const randomMessage = () => setGreeting(messages[Math.floor(Math.random() * messages.length)]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">{greeting}</h3>
      <button
        onClick={randomMessage}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md transition-colors duration-200 font-medium"
      >
        New Message
      </button>
    </div>
  );
}