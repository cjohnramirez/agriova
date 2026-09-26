import { fireEvent, render, screen } from '@testing-library/react-native';
import { Receipt } from 'lucide-react-native';

import { ChoiceCard, ScreenHeader, TextField } from '@/ui';

describe('TextField', () => {
  it('is found by its label and reports typing', async () => {
    const onChangeText = jest.fn();
    await render(<TextField label="Your name" value="" onChangeText={onChangeText} />);
    await fireEvent.changeText(screen.getByLabelText('Your name'), 'Nena');
    expect(onChangeText).toHaveBeenCalledWith('Nena');
  });

  // An error must be readable text, not just a red border.
  it('shows the error in place of the hint', async () => {
    await render(
      <TextField label="Barangay" hint="Where your farm is." error="Please fill this in." />,
    );
    expect(screen.getByText('Please fill this in.')).toBeOnTheScreen();
    expect(screen.queryByText('Where your farm is.')).toBeNull();
  });
});

describe('ChoiceCard', () => {
  it('speaks the title and hint together as one button', async () => {
    const onPress = jest.fn();
    await render(
      <ChoiceCard icon={Receipt} title="Expense" hint="Money you spent" onPress={onPress} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Expense. Money you spent' }));
    expect(onPress).toHaveBeenCalled();
  });

  it('acts as a radio when it carries a selection', async () => {
    await render(<ChoiceCard title="Binisaya" selected onPress={() => {}} />);
    expect(screen.getByRole('radio', { name: 'Binisaya' })).toBeSelected();
  });
});

describe('ScreenHeader', () => {
  it('announces its title as a header and goes back', async () => {
    const onBack = jest.fn();
    await render(<ScreenHeader title="Settings" backLabel="Back" onBack={onBack} />);
    expect(screen.getByRole('header', { name: 'Settings' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Back' }));
    expect(onBack).toHaveBeenCalled();
  });
});
