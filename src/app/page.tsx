export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">DCF Calculator</h1>
        
        <form className="bg-white rounded-lg shadow-md p-8 space-y-8">
          {/* Investment */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Investment</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Initial Investment ($)
              </label>
              <input
                type="number"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Revenue */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Revenue</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Annual Rental Income ($)
              </label>
              <input
                type="number"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Expenses */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Annual Expenses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Charge ($)
                </label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ground Rent ($)
                </label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maintenance ($)
                </label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property Tax ($)
                </label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance ($)
                </label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Management Fees ($)
                </label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                One-time Expenses ($)
              </label>
              <input
                type="number"
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Assumptions */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800 border-b border-gray-200 pb-2">Assumptions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cash Flow Growth Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Discount Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Holding Period (years)
                </label>
                <input
                  type="number"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-4 rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium text-lg transition-colors"
          >
            Calculate DCF
          </button>
        </form>
      </div>
    </main>
  );
}
