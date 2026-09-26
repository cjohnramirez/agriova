import { fireEvent, render, screen } from '@testing-library/react-native';
import { ArrowUpRight, Ruler } from 'lucide-react-native';

import { Card, ChatBubble, MetricTile, ProductCard, Section, Text } from '@/ui';

describe('MetricTile', () => {
  it('reads as one phrase', async () => {
    await render(<MetricTile icon={Ruler} label="Plots" value="2" caption="1.1 ha" />);
    expect(screen.getByLabelText('Plots, 2, 1.1 ha')).toBeOnTheScreen();
  });
});

describe('Section', () => {
  it('announces its title as a header and runs its action', async () => {
    const onPress = jest.fn();
    await render(
      <Section title="Your farm" action={{ icon: ArrowUpRight, label: 'See statistics', onPress }}>
        <Text>Body</Text>
      </Section>,
    );
    expect(screen.getByRole('header', { name: 'Your farm' })).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'See statistics' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('Card', () => {
  it('becomes one button when it has onPress', async () => {
    const onPress = jest.fn();
    await render(
      <Card onPress={onPress} accessibilityLabel="Near the river, 2,500 m²">
        <Text>Near the river</Text>
      </Card>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Near the river, 2,500 m²' }));
    expect(onPress).toHaveBeenCalled();
  });
});

describe('ChatBubble', () => {
  it('shows the message and its note', async () => {
    await render(<ChatBubble from="farmer" text="When to sell?" note="Waiting for signal" />);
    expect(screen.getByText('When to sell?')).toBeOnTheScreen();
    expect(screen.getByText('Waiting for signal')).toBeOnTheScreen();
  });
});

describe('ProductCard', () => {
  it('speaks name, price and seller together', async () => {
    const onPress = jest.fn();
    await render(
      <ProductCard
        name="Hybrid corn seed"
        price="₱4,200.00"
        per="per 18 kg bag"
        seller="Gingoog Farmers Coop"
        onPress={onPress}
      />,
    );
    await fireEvent.press(
      screen.getByRole('button', {
        name: 'Hybrid corn seed, ₱4,200.00 per 18 kg bag, Gingoog Farmers Coop',
      }),
    );
    expect(onPress).toHaveBeenCalled();
  });
});
