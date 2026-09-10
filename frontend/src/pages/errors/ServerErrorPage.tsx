import React from 'react';
import { Link } from 'react-router-dom';

export default function ServerErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-9xl font-extrabold text-gray-900">500</h1>
        <p className="mt-4 text-xl text-gray-500">Internal Server Error.</p>
        <Link to="/" className="mt-6 inline-block btn-primary">Go back home</Link>
      </div>
    </div>
  );
}