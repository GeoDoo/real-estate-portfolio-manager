import React from 'react';
import { render, screen, fireEvent } from '@/lib/test-utils';
import userEvent from '@testing-library/user-event';
import ValuationForm from './ValuationForm';

describe('ValuationForm', () => {
  const defaultForm = {
    initial_investment: '',
    transaction_costs: '',
    property_tax: '',
    annual_rental_income: '',
    vacancy_rate: '',
    service_charge: '',
    ground_rent: '',
    maintenance: '',
    insurance: '',
    management_fees: '',
    annual_rent_growth: '',
    discount_rate: '',
    holding_period: '',
    ltv: '',
    interest_rate: '',
  };

  const mockOnChange = jest.fn();
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders all form sections', () => {
      render(
        <ValuationForm
          form={defaultForm}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      // Check section headers
      expect(screen.getByText('Initial Investment & One-off Costs')).toBeInTheDocument();
      expect(screen.getByText('Annual Income')).toBeInTheDocument();
      expect(screen.getByText('Annual Expenses')).toBeInTheDocument();
      expect(screen.getByText('Assumptions')).toBeInTheDocument();
    });

    it('renders all required fields with asterisks', () => {
      render(
        <ValuationForm
          form={defaultForm}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      // Check required field labels
      expect(screen.getByText(/Purchase Price/)).toBeInTheDocument();
      expect(screen.getByText(/Transaction Costs/)).toBeInTheDocument();
      expect(screen.getByText(/Property Tax/)).toBeInTheDocument();
      expect(screen.getByText(/Annual Rental Income/)).toBeInTheDocument();
      expect(screen.getByText(/Maintenance/)).toBeInTheDocument();
      expect(screen.getByText(/Management Fees/)).toBeInTheDocument();
      expect(screen.getByText(/Annual Rent Growth/)).toBeInTheDocument();
      expect(screen.getByText(/Discount Rate/)).toBeInTheDocument();
      expect(screen.getByText(/Holding Period/)).toBeInTheDocument();

      // Check for asterisks (red color)
      const asterisks = document.querySelectorAll('span[style*="color: red"]');
      expect(asterisks.length).toBeGreaterThan(0);
    });

    it('renders form fields with correct values', () => {
      const formWithValues = {
        ...defaultForm,
        initial_investment: '500000',
        annual_rental_income: '30000',
        vacancy_rate: '5',
      };

      render(
        <ValuationForm
          form={formWithValues}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByDisplayValue('500000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('30000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('5')).toBeInTheDocument();
    });

    it('renders error message when provided', () => {
      render(
        <ValuationForm
          form={defaultForm}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          error="This is an error message"
        />
      );

      expect(screen.getByText('This is an error message')).toBeInTheDocument();
      expect(screen.getByText('This is an error message')).toHaveClass('text-red-600');
    });

    it('disables all inputs when disabled prop is true', () => {
      render(
        <ValuationForm
          form={defaultForm}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
          disabled={true}
        />
      );

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toBeDisabled();
      });
    });
  });

  describe('user interactions', () => {
    it('calls onChange when user types in input fields', async () => {
      const user = userEvent.setup();
      render(
        <ValuationForm
          form={defaultForm}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const purchasePriceInput = document.querySelector('input[name="initial_investment"]');
      await user.type(purchasePriceInput!, '500000');

      expect(mockOnChange).toHaveBeenCalled();
    });

    it('calls onSubmit when form is submitted', async () => {
      const user = userEvent.setup();
      render(
        <ValuationForm
          form={defaultForm}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const form = document.querySelector('form');
      await user.click(form!);
      fireEvent.submit(form!);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it('handles input changes correctly', async () => {
      const user = userEvent.setup();
      render(
        <ValuationForm
          form={defaultForm}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const purchasePriceInput = document.querySelector('input[name="initial_investment"]');
      await user.type(purchasePriceInput!, '500000');

      expect(mockOnChange).toHaveBeenCalled();
    });
  });

  describe('conditional rendering', () => {
    it('shows interest rate field when LTV is greater than 0', () => {
      const formWithLTV = {
        ...defaultForm,
        ltv: '80',
      };

      render(
        <ValuationForm
          form={formWithLTV}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.getByText('Interest Rate (%)')).toBeInTheDocument();
      // Find the interest rate input by its name attribute
      const interestRateInput = document.querySelector('input[name="interest_rate"]');
      expect(interestRateInput).toBeInTheDocument();
    });

    it('hides interest rate field when LTV is 0 or empty', () => {
      const formWithoutLTV = {
        ...defaultForm,
        ltv: '0',
      };

      render(
        <ValuationForm
          form={formWithoutLTV}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      expect(screen.queryByText('Interest Rate (%)')).not.toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('renders required field indicators', () => {
      render(
        <ValuationForm
          form={defaultForm}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      // Check that required fields have asterisks
      const requiredLabels = [
        'Purchase Price (£)',
        'Transaction Costs (£)',
        'Property Tax (£)',
        'Annual Rental Income (£)',
        'Maintenance (£)',
        'Management Fees (%)',
        'Annual Rent Growth (%)',
        'Discount Rate (%)',
        'Holding Period (Years)',
      ];

      requiredLabels.forEach(label => {
        const labelElement = screen.getByText(label);
        expect(labelElement).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('has proper form structure', () => {
      render(
        <ValuationForm
          form={defaultForm}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      // Check that form element exists
      const formElement = document.querySelector('form');
      expect(formElement).toBeInTheDocument();
    });

    it('has proper labels for all inputs', () => {
      render(
        <ValuationForm
          form={defaultForm}
          onChange={mockOnChange}
          onSubmit={mockOnSubmit}
        />
      );

      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAttribute('name');
        // Each input should have an associated label
        const name = input.getAttribute('name');
        if (name) {
          const label = screen.getByText(new RegExp(name.replace(/_/g, ' '), 'i'));
          expect(label).toBeInTheDocument();
        }
      });
    });
  });
}); 