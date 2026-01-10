"use client"
import React from 'react';

const SimpleComponent = () => {
    return (
        <div className="max-w-md mx-auto p-4 bg-white rounded-md shadow-md">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Hello, World!</h1>
            <p className="text-lg font-bold text-gray-600 mb-4">This is a simple React component.</p>
            <button
                className="bg-orange-500 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-md"
                onClick={() => console.log('Button clicked!')}
            >
                Click me!
            </button>
        </div>
    );
};

export default SimpleComponent;