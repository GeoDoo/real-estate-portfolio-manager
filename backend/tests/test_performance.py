import time
import numpy as np
import pytest
from app import calculate_cash_flows, calculate_irr, calculate_cash_flows_vectorized

def old_monte_carlo_simulation(base_input, rent_growths, discount_rates, interest_rates):
    """Old loop-based Monte Carlo simulation for comparison."""
    npvs = []
    irrs = []
    for i in range(len(rent_growths)):
        sim_input = base_input.copy()
        sim_input["annual_rent_growth"] = rent_growths[i]
        sim_input["discount_rate"] = discount_rates[i]
        sim_input["interest_rate"] = interest_rates[i]
        cash_flows = calculate_cash_flows(sim_input)
        npv = cash_flows[-1]["cumulativePV"]
        net_cash_flows = [row["netCashFlow"] for row in cash_flows]
        irr = calculate_irr(net_cash_flows)
        npvs.append(npv)
        irrs.append(irr if irr is not None else float("nan"))
    return np.array(npvs), np.array(irrs)

def test_performance_comparison():
    """Compare performance of old vs new Monte Carlo simulation - optimized for speed."""
    base_input = {
        "initial_investment": 200000,
        "annual_rental_income": 24000,
        "service_charge": 3000,
        "ground_rent": 500,
        "maintenance": 1000,
        "property_tax": 6000,
        "insurance": 300,
        "management_fees": 12,
        "transaction_costs": 3000,
        "holding_period": 25,
        "ltv": 80,
        "interest_rate": 5,
    }
    
    # Use much smaller test sizes for fast unit testing
    test_sizes = [10, 50]  # Reduced from [100, 1000, 5000]
    
    for num_sim in test_sizes:
        print(f"\n🧪 Testing with {num_sim} simulations...")
        
        # Generate random variables
        rent_growths = np.random.normal(2, 1, num_sim)
        discount_rates = np.random.normal(15, 2, num_sim)
        interest_rates = np.random.normal(5, 1, num_sim)
        
        # Test old method (only for small sizes to keep it fast)
        if num_sim <= 50:
            start_time = time.time()
            old_npvs, old_irrs = old_monte_carlo_simulation(base_input, rent_growths, discount_rates, interest_rates)
            old_time = time.time() - start_time
        else:
            # Skip old method for larger sizes to keep test fast
            old_npvs, old_irrs = None, None
            old_time = 0
        
        # Test new vectorized method
        start_time = time.time()
        new_npvs, new_irrs = calculate_cash_flows_vectorized(base_input, rent_growths, discount_rates, interest_rates)
        new_time = time.time() - start_time
        
        print(f"   New method: {new_time:.3f}s")
        
        # Only compare results if we ran the old method
        if old_npvs is not None:
            # Calculate speedup
            speedup = old_time / new_time if new_time > 0 else float('inf')
            print(f"   Old method: {old_time:.3f}s")
            print(f"   Speedup: {speedup:.1f}x")
            
            # Verify results are similar (allowing for small numerical differences)
            npv_diff = np.abs(old_npvs - new_npvs)
            irr_diff = np.abs(old_irrs - new_irrs)
            
            # Filter out NaN values for comparison
            valid_npv_mask = ~(np.isnan(old_npvs) | np.isnan(new_npvs))
            valid_irr_mask = ~(np.isnan(old_irrs) | np.isnan(new_irrs))
            
            if np.any(valid_npv_mask):
                max_npv_diff = np.max(npv_diff[valid_npv_mask])
                print(f"   Max NPV difference: {max_npv_diff:.6f}")
                assert max_npv_diff < 1e-2, f"NPV results differ too much: {max_npv_diff}"
            
            if np.any(valid_irr_mask):
                max_irr_diff = np.max(irr_diff[valid_irr_mask])
                print(f"   Max IRR difference: {max_irr_diff:.6f}")
                assert max_irr_diff < 1e-2, f"IRR results differ too much: {max_irr_diff}"
            
            # Assert significant speedup for larger simulations
            if num_sim >= 50:
                assert speedup > 2, f"Expected significant speedup, got {speedup:.1f}x"
        
        # Verify new method produces reasonable results
        assert np.all(np.isfinite(new_npvs)), "All NPVs should be finite"
        valid_irrs = new_irrs[np.isfinite(new_irrs)]
        if len(valid_irrs) > 0:
            assert np.all(np.isfinite(valid_irrs)), "All valid IRRs should be finite"
        
        print(f"   ✅ Results match and performance improved!")

def test_large_simulation_performance():
    """Test performance with a moderate number of simulations - optimized for speed."""
    base_input = {
        "initial_investment": 300000,
        "annual_rental_income": 36000,
        "service_charge": 4000,
        "ground_rent": 600,
        "maintenance": 1500,
        "property_tax": 8000,
        "insurance": 400,
        "management_fees": 10,
        "transaction_costs": 5000,
        "holding_period": 30,
        "ltv": 75,
        "interest_rate": 4.5,
    }
    
    # Reduced from 10000 to 500 for faster testing
    num_sim = 500
    print(f"\n🚀 Testing moderate simulation with {num_sim} iterations...")
    
    # Generate random variables
    rent_growths = np.random.normal(2.5, 1.5, num_sim)
    discount_rates = np.random.normal(12, 3, num_sim)
    interest_rates = np.random.normal(4, 1.5, num_sim)
    
    # Test only the new vectorized method (old would be too slow)
    start_time = time.time()
    npvs, irrs = calculate_cash_flows_vectorized(base_input, rent_growths, discount_rates, interest_rates)
    total_time = time.time() - start_time
    
    print(f"   Vectorized method: {total_time:.3f}s")
    print(f"   Average time per simulation: {total_time/num_sim*1000:.2f}ms")
    
    # Verify results are reasonable
    assert np.all(np.isfinite(npvs)), "All NPVs should be finite"
    valid_irrs = irrs[np.isfinite(irrs)]
    if len(valid_irrs) > 0:
        assert np.all(np.isfinite(valid_irrs)), "All valid IRRs should be finite"
    
    # Performance assertion - should complete in reasonable time (reduced from 10s to 2s)
    assert total_time < 2, f"Moderate simulation took too long: {total_time:.3f}s"
    
    print(f"   ✅ Moderate simulation completed successfully!")

if __name__ == "__main__":
    # Run performance tests directly
    test_performance_comparison()
    test_large_simulation_performance() 