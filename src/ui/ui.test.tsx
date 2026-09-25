import { fireEvent, render, screen } from '@testing-library/react-native';
import { Bell } from 'lucide-react-native';

import { AlertCard, Button, FilterPills, IconButton, ListRow, WeekStrip } from '@/ui';

describe('Button', () => {
  it('exposes its label as a button and fires onPress', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not fire while disabled, and says so to screen readers', async () => {
    const onPress = jest.fn();
    await render(<Button label="Save" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Save' });
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
    expect(button).toBeDisabled();
  });
});

describe('IconButton', () => {
  // An icon alone is silent to a screen reader; the label is what gets spoken.
  it('is reachable by its label', async () => {
    const onPress = jest.fn();
    await render(<IconButton icon={Bell} label="Notifications" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Notifications' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('FilterPills', () => {
  const options = [
    { key: 'all', label: 'All' },
    { key: 'seeds', label: 'Seeds' },
  ] as const;

  it('marks the selected pill for screen readers and reports taps', async () => {
    const onSelect = jest.fn();
    await render(
      <FilterPills label="Filter" options={options} selected="all" onSelect={onSelect} />,
    );
    expect(screen.getByRole('radio', { name: 'All' })).toBeSelected();
    expect(screen.getByRole('radio', { name: 'Seeds' })).not.toBeSelected();
    await fireEvent.press(screen.getByRole('radio', { name: 'Seeds' }));
    expect(onSelect).toHaveBeenCalledWith('seeds');
  });
});

describe('WeekStrip', () => {
  const days = [
    { date: '2026-05-14', weekday: 'T', spoken: 'Tuesday, May 14' },
    { date: '2026-05-15', weekday: 'W', spoken: 'Wednesday, May 15' },
  ];

  it('shows day numbers without leading zeros and selects by date', async () => {
    const onSelect = jest.fn();
    await render(<WeekStrip days={days} selected="2026-05-15" onSelect={onSelect} />);
    expect(screen.getByText('14')).toBeOnTheScreen();
    expect(screen.getByRole('tab', { name: 'Wednesday, May 15' })).toBeSelected();
    await fireEvent.press(screen.getByRole('tab', { name: 'Tuesday, May 14' }));
    expect(onSelect).toHaveBeenCalledWith('2026-05-14');
  });
});

describe('AlertCard', () => {
  it('renders the message and its action', async () => {
    const onPress = jest.fn();
    await render(
      <AlertCard
        kind="warning"
        title="Heat warning"
        body="Fertilizer will evaporate before noon."
        action={{ label: 'Reschedule', onPress }}
      />,
    );
    expect(screen.getByText('Heat warning')).toBeOnTheScreen();
    expect(screen.getByText('Fertilizer will evaporate before noon.')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Reschedule' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ListRow', () => {
  it('speaks the title and value together, and is static without onPress', async () => {
    const { rerender } = await render(
      <ListRow title="Language" value="English" onPress={() => {}} />,
    );
    expect(screen.getByRole('button', { name: 'Language, English' })).toBeOnTheScreen();
    await rerender(<ListRow title="Language" value="English" />);
    expect(screen.queryByRole('button')).toBeNull();
  });
});
