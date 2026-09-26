/**
 * The tab and detail screens, rendered against real SQLite holding the sample
 * farm. These check what a farmer would see, including that a new record
 * shows up without anything being refreshed by hand.
 */
import { fireEvent, screen } from '@testing-library/react-native';

import Activity from '../app/(tabs)/activity';
import Assistant from '../app/(tabs)/assistant';
import Fields from '../app/(tabs)/fields';
import Home from '../app/(tabs)/index';
import Shop from '../app/(tabs)/shop';
import Notifications from '../app/notifications';
import PlotDetail from '../app/plot/[id]';
import Statistics from '../app/statistics';
import { addDays, todayLocal } from '@/db/units';
import { formatDateLong } from '@/i18n/dates';
import { ShopBrowser } from '@/shop/ShopBrowser';
import type { Listing } from '@/shop/listings';
import { renderScreen, TEST_OWNER } from '@/testing/renderScreen';

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  navigate: jest.fn(),
  canGoBack: () => true,
};
const mockParams: { id?: string } = {};

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockParams,
}));
jest.mock('@/auth/SessionProvider', () => ({
  useSession: () => ({
    session: {
      userId: 'owner-1',
      phone: '9171234567',
      profile: { name: 'Nena', barangay: 'Gusa' },
    },
  }),
  useOwnerId: () => 'owner-1',
}));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

beforeEach(() => jest.clearAllMocks());

describe('Home', () => {
  it('leads with the season’s earnings', async () => {
    await renderScreen(<Home />);
    expect(screen.getByText('₱530.00')).toBeOnTheScreen();
    expect(screen.getByText('Sold ₱12,510')).toBeOnTheScreen();
    expect(screen.getByText('Spent ₱11,980')).toBeOnTheScreen();
  });

  it('counts down the produce waiting to be sold', async () => {
    await renderScreen(<Home />);
    expect(screen.getByText('50 kg Tomato')).toBeOnTheScreen();
    expect(screen.getByText('2 days left')).toBeOnTheScreen();
    // Two days out is a reminder, not yet an alarm.
    expect(screen.queryByText('Sell soon')).toBeNull();
  });

  it('raises the alarm on the last day', async () => {
    const { db, changed } = await renderScreen(<Home />);
    db.exec(`update harvest set harvested_on = '${addDays(todayLocal(), -7)}'
             where quantity_milli = 80000`);
    await changed();
    expect(screen.getByText('Sell soon')).toBeOnTheScreen();
    expect(screen.getByText('50 kg Tomato from Duol sa suba. Last day.')).toBeOnTheScreen();
  });

  it('updates the moment a sale is written', async () => {
    const { runner, changed } = await renderScreen(<Home />);
    runner.run(
      `insert into sale (id, harvest_id, channel, buyer_name, quantity_milli, unit_price_centavos,
         total_centavos, sold_on, owner_id, created_at, updated_at, deleted_at)
       select 'new-sale', id, 'direct', null, 10000, 5000, 50000, ?, ?, 9e12, 9e12, null
       from harvest where quantity_milli = 80000`,
      [todayLocal(), TEST_OWNER],
    );
    await changed();
    expect(screen.getByText('₱1,030.00')).toBeOnTheScreen();
    expect(screen.getByText('40 kg Tomato')).toBeOnTheScreen();
  });

  it('invites the first sale when there are no records', async () => {
    await renderScreen(<Home />, { farm: false });
    expect(screen.getByText('₱0.00')).toBeOnTheScreen();
    expect(screen.getByText('Record a sale and your earnings will show here.')).toBeOnTheScreen();
    expect(screen.queryByText('Latest records')).toBeNull();
  });

  it('opens statistics and the full record list', async () => {
    await renderScreen(<Home />);
    await fireEvent.press(screen.getByRole('button', { name: 'See statistics' }));
    expect(mockRouter.push).toHaveBeenCalledWith('/statistics');
    await fireEvent.press(screen.getByRole('button', { name: 'See all records' }));
    expect(mockRouter.navigate).toHaveBeenCalledWith('/activity');
  });
});

describe('Fields', () => {
  it('lists each plot with what grows on it and opens it', async () => {
    await renderScreen(<Fields />);
    expect(screen.getByText('2 plots')).toBeOnTheScreen();
    expect(screen.getByText('Tomato · Harvesting')).toBeOnTheScreen();
    expect(screen.getByText('Corn · Growing')).toBeOnTheScreen();
    await fireEvent.press(
      screen.getByRole('button', { name: 'Luna sa bungtod, 8,000 m², Earnings -₱6,100.00' }),
    );
    expect(mockRouter.push).toHaveBeenCalledWith(expect.stringMatching(/^\/plot\/test-/));
  });

  it('asks for the first plot when there is none', async () => {
    await renderScreen(<Fields />, { farm: false });
    expect(screen.getByText('No plots yet')).toBeOnTheScreen();
    await fireEvent.press(screen.getByRole('button', { name: 'Add plot' }));
    expect(mockRouter.push).toHaveBeenCalledWith('/plot/new');
  });
});

describe('Plot detail', () => {
  it('separates what is planted now from past seasons', async () => {
    mockParams.id = 'test-1'; // the first plot the sample farm creates
    await renderScreen(<PlotDetail />);
    expect(screen.getByRole('header', { name: 'Duol sa suba' })).toBeOnTheScreen();
    expect(screen.getByText('Tomato')).toBeOnTheScreen();
    expect(screen.getByText('Harvesting')).toBeOnTheScreen();
    expect(screen.getByText('Past seasons')).toBeOnTheScreen();
    expect(screen.getByText('Eggplant')).toBeOnTheScreen();
    expect(screen.getByText('Earnings -₱600.00')).toBeOnTheScreen();
  });

  it('says so when the plot is gone', async () => {
    mockParams.id = 'missing';
    await renderScreen(<PlotDetail />);
    expect(screen.getByText('This plot was removed.')).toBeOnTheScreen();
  });
});

describe('Activity', () => {
  it('shows a day’s records and filters them by kind', async () => {
    await renderScreen(<Activity />);
    // Today has nothing: the empty state says so and invites a record.
    expect(
      screen.getByText(`Nothing recorded on ${formatDateLong(todayLocal(), 'en')}.`),
    ).toBeOnTheScreen();
    expect(screen.getAllByRole('button', { name: 'Record' })).toHaveLength(2);

    const yesterday = addDays(todayLocal(), -1);
    if (new Date().getDay() === 0) {
      await fireEvent.press(screen.getByRole('button', { name: 'Previous week' }));
    }
    await fireEvent.press(screen.getByLabelText(formatDateLong(yesterday, 'en')));
    expect(screen.getByText('Transport')).toBeOnTheScreen();
    expect(screen.getByText('-₱350.00')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Sale' }));
    expect(screen.queryByText('Transport')).toBeNull();
  });
});

describe('Assistant', () => {
  it('keeps a question on screen with an honest note', async () => {
    await renderScreen(<Assistant />, { farm: false });
    await fireEvent.press(
      screen.getByRole('button', { name: 'Suggestion. When should I sell my tomatoes?' }),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    expect(screen.getByText('When should I sell my tomatoes?')).toBeOnTheScreen();
    expect(
      screen.getByText('The assistant is not connected yet. Your question is kept here.'),
    ).toBeOnTheScreen();
  });

  it('will not send an empty question', async () => {
    await renderScreen(<Assistant />, { farm: false });
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });
});

describe('Notifications', () => {
  it('lists produce close to spoiling', async () => {
    await renderScreen(<Notifications />);
    expect(screen.getByText('Sell your Tomato')).toBeOnTheScreen();
  });

  it('is empty with nothing on hand', async () => {
    await renderScreen(<Notifications />, { farm: false });
    expect(screen.getByText('No notifications yet.')).toBeOnTheScreen();
  });
});

describe('Statistics', () => {
  it('breaks the season down by spending and harvest', async () => {
    await renderScreen(<Statistics />);
    expect(screen.getByLabelText('Total size, 1.1 ha')).toBeOnTheScreen();
    expect(screen.getByLabelText('Waiting to send, 0, Everything is sent.')).toBeOnTheScreen();
    expect(screen.getByText('₱5,500.00')).toBeOnTheScreen();
    expect(screen.getByText('350 kg')).toBeOnTheScreen();
  });
});

describe('Shop', () => {
  it('says the shop is coming while there are no listings', async () => {
    await renderScreen(<Shop />, { farm: false });
    expect(screen.getByText('The shop opens soon')).toBeOnTheScreen();
  });

  it('filters listings by type and by search', async () => {
    const listings: Listing[] = [
      {
        id: 'a',
        name: 'Hybrid corn seed',
        category: 'seeds',
        priceCentavos: 420_000,
        per: '18 kg bag',
        seller: 'Claveria Seed',
        photoUri: null,
      },
      {
        id: 'b',
        name: 'Agricultural lime',
        category: 'fertilizer',
        priceCentavos: 25_000,
        per: '50 kg sack',
        seller: 'Gingoog Coop',
        photoUri: null,
      },
    ];
    await renderScreen(<ShopBrowser listings={listings} onOpen={() => {}} />, { farm: false });
    expect(screen.getByText('Hybrid corn seed')).toBeOnTheScreen();

    await fireEvent.press(screen.getByRole('radio', { name: 'Fertilizer' }));
    expect(screen.queryByText('Hybrid corn seed')).toBeNull();
    expect(screen.getByText('Agricultural lime')).toBeOnTheScreen();

    await fireEvent.changeText(screen.getByLabelText('Search products'), 'corn');
    expect(screen.getByText('Nothing matches "corn".')).toBeOnTheScreen();
  });
});
