import { render, screen } from '@testing-library/react';
import Worklist from './Worklist';

test('renders learn react link', () => {
  render(<Worklist />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
