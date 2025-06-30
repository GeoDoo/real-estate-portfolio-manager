import React from 'react';
import { render, screen, fireEvent } from '@/lib/test-utils';
import userEvent from '@testing-library/user-event';
import InfoTooltip from './InfoTooltip';

describe('InfoTooltip', () => {
  beforeEach(() => {
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      left: 100,
      top: 100,
      width: 50,
      height: 20,
      bottom: 120,
      right: 150,
      x: 100,
      y: 100,
      toJSON: () => {},
    }));
  });

  describe('rendering', () => {
    it('renders label correctly', () => {
      render(
        <InfoTooltip label="Click me" tooltip="This is a tooltip">
          Click me
        </InfoTooltip>
      );

      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('renders with custom className', () => {
      render(
        <InfoTooltip 
          label="Test" 
          tooltip="Tooltip" 
          className="custom-class"
        />
      );

      // The outermost span is the first span in the document with the class
      const allSpans = document.querySelectorAll('span');
      const outerSpan = Array.from(allSpans).find(span => span.className.includes('custom-class'));
      expect(outerSpan).toHaveClass('custom-class');
    });

    it('renders React element as label', () => {
      const LabelComponent = () => <span data-testid="custom-label">Custom Label</span>;
      
      render(
        <InfoTooltip 
          label={<LabelComponent />} 
          tooltip="Tooltip content"
        />
      );

      expect(screen.getByTestId('custom-label')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('shows tooltip on mouse enter', async () => {
      const user = userEvent.setup();
      render(
        <InfoTooltip label="Hover me" tooltip="Tooltip content">
          Hover me
        </InfoTooltip>
      );

      const label = screen.getByText('Hover me');
      await user.hover(label);

      expect(screen.getByText('Tooltip content')).toBeInTheDocument();
    });

    it('hides tooltip on mouse leave', async () => {
      const user = userEvent.setup();
      render(
        <InfoTooltip label="Hover me" tooltip="Tooltip content">
          Hover me
        </InfoTooltip>
      );

      const label = screen.getByText('Hover me');
      await user.hover(label);
      expect(screen.getByText('Tooltip content')).toBeInTheDocument();

      await user.unhover(label);
      expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
    });

    it('shows tooltip on focus', () => {
      render(
        <InfoTooltip label="Focus me" tooltip="Tooltip content">
          Focus me
        </InfoTooltip>
      );

      const label = screen.getByText('Focus me');
      fireEvent.focus(label);

      expect(screen.getByText('Tooltip content')).toBeInTheDocument();
    });

    it('hides tooltip on blur', () => {
      render(
        <InfoTooltip label="Focus me" tooltip="Tooltip content">
          Focus me
        </InfoTooltip>
      );

      const label = screen.getByText('Focus me');
      fireEvent.focus(label);
      expect(screen.getByText('Tooltip content')).toBeInTheDocument();

      fireEvent.blur(label);
      expect(screen.queryByText('Tooltip content')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper tabindex for keyboard navigation', () => {
      render(
        <InfoTooltip label="Accessible" tooltip="Tooltip">
          Accessible
        </InfoTooltip>
      );

      const label = screen.getByText('Accessible');
      expect(label).toHaveAttribute('tabIndex', '0');
    });

    it('supports keyboard navigation', () => {
      render(
        <InfoTooltip label="Keyboard" tooltip="Tooltip">
          Keyboard
        </InfoTooltip>
      );

      const label = screen.getByText('Keyboard');
      expect(label).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('tooltip positioning', () => {
    it('positions tooltip correctly', async () => {
      const user = userEvent.setup();
      render(
        <InfoTooltip label="Position test" tooltip="Positioned tooltip">
          Position test
        </InfoTooltip>
      );

      const label = screen.getByText('Position test');
      await user.hover(label);

      const tooltip = screen.getByText('Positioned tooltip');
      expect(tooltip).toBeInTheDocument();
      expect(tooltip).toHaveClass('fixed');
    });
  });

  describe('event listeners', () => {
    it('adds scroll and resize listeners when tooltip is shown', async () => {
      const user = userEvent.setup();
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      
      render(
        <InfoTooltip label="Test" tooltip="Tooltip">
          Test
        </InfoTooltip>
      );

      const label = screen.getByText('Test');
      await user.hover(label);

      expect(addEventListenerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), true);
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function), true);

      addEventListenerSpy.mockRestore();
    });
  });
}); 