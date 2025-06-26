export default function Home() {
  return (
    <main className="min-h-screen p-8">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">DCF Calculator</h1>
        
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Initial Investment ($)
            </label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Annual Cash Flow - Year 1 ($)
            </label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Cash Flow Growth Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full p-2 border rounded"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Discount Rate (%)
            </label>
            <input
              type="number"
              step="0.1"
              className="w-full p-2 border rounded"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Holding Period (years)
            </label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              placeholder="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Terminal Value ($)
            </label>
            <input
              type="number"
              className="w-full p-2 border rounded"
              placeholder="0"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Calculate DCF
          </button>
        </form>
      </div>
    </main>
  );
}
