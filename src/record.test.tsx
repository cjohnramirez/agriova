/**
 * The record forms, driven the way a farmer would: type, tap, save. Each test
 * reads the database afterwards, so a form that shows success but writes the
 * wrong thing fails here.
 */
import { fireEvent, screen } from '@testing-library/react-native';

import { ExpenseForm } from '@/features/record/ExpenseForm';
import { HarvestForm } from '@/features/record/HarvestForm';
import { PlantingForm } from '@/features/record/PlantingForm';
import { SaleForm } from '@/features/record/SaleForm';
import { todayLocal } from '@/db/units';
import { renderScreen } from '@/testing/renderScreen';

const mockRouter = { push: jest.fn(), back: jest.fn(), replace: jest.fn(), canGoBack: () => true };

jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/auth/SessionProvider', () => ({
  useSession: () => ({ session: { userId: 'owner-1', phone: '9171234567' } }),
  useOwnerId: () => 'owner-1',
}));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

beforeEach(() => jest.clearAllMocks());

const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));
const pick = (name: string) => fireEvent.press(screen.getByRole('radio', { name }));
const type = (label: string, text: string) =>
  fireEvent.changeText(screen.getByLabelText(label), text);

describe('Expense form', () => {
  it('records an expense against the chosen planting', async () => {
    const { db } = await renderScreen(<ExpenseForm />);
    await type('Amount', '1,250.5');
    await pick('Fertilizer');
    await pick('Corn. Luna sa bungtod');
    await press('Save');

    expect(
      db
        .prepare(
          `select e.category, e.amount_centavos, e.spent_on, cr.name_en as crop
           from expense e join cycle c on c.id = e.cycle_id join crop cr on cr.id = c.crop_id
           order by e.rowid desc limit 1`,
        )
        .get(),
    ).toEqual({
      category: 'fertilizer',
      amount_centavos: 125_050,
      spent_on: todayLocal(),
      crop: 'Corn',
    });
    expect(mockRouter.back).toHaveBeenCalled();
  });

  it('says what is missing instead of saving', async () => {
    const { db } = await renderScreen(<ExpenseForm />);
    const before = db.prepare('select count(*) as n from expense').get();
    await press('Save');
    expect(screen.getByText('Enter an amount above zero.')).toBeOnTheScreen();
    expect(screen.getAllByText('Choose one.')).toHaveLength(2);
    expect(db.prepare('select count(*) as n from expense').get()).toEqual(before);
    expect(mockRouter.back).not.toHaveBeenCalled();
  });

  it('asks for a planting first when there is none', async () => {
    await renderScreen(<ExpenseForm />, { farm: false });
    await press('Start a planting');
    expect(mockRouter.replace).toHaveBeenCalledWith({
      pathname: '/record/[kind]',
      params: { kind: 'planting' },
    });
  });
});

describe('Harvest form', () => {
  it('starts on the crop’s usual unit', async () => {
    const { db } = await renderScreen(<HarvestForm />);
    await pick('Corn. Luna sa bungtod');
    // Corn is sold by the sack.
    expect(screen.getByRole('radio', { name: 'sack' })).toBeSelected();
    await type('How much', '12.5');
    await press('Save');
    expect(
      db.prepare('select quantity_milli, unit from harvest order by rowid desc limit 1').get(),
    ).toEqual({ quantity_milli: 12_500, unit: 'sack' });
  });
});

describe('Sale form', () => {
  it('shows the total while typing and records the sale', async () => {
    const { db } = await renderScreen(<SaleForm />);
    // The sample farm has one harvest with produce left, so it is preselected.
    await type('How much did you sell?', '20');
    await type('Price per kg', '47.50');
    expect(screen.getByText('Total ₱950.00')).toBeOnTheScreen();
    await pick('Middleman');
    await press('Save');

    expect(
      db
        .prepare(
          'select channel, quantity_milli, total_centavos from sale order by rowid desc limit 1',
        )
        .get(),
    ).toEqual({ channel: 'middleman', quantity_milli: 20_000, total_centavos: 95_000 });
  });

  it('will not sell more than is left', async () => {
    const { db } = await renderScreen(<SaleForm />);
    const before = db.prepare('select count(*) as n from sale').get();
    await type('How much did you sell?', '51');
    await type('Price per kg', '40');
    await pick('Buyer directly');
    await press('Save');
    expect(screen.getByText('Only 50 kg is left of this harvest.')).toBeOnTheScreen();
    expect(db.prepare('select count(*) as n from sale').get()).toEqual(before);
  });
});

describe('Planting form', () => {
  it('asks for a plot when there is none', async () => {
    await renderScreen(<PlantingForm />, { farm: false });
    expect(screen.getByText('Add a plot first')).toBeOnTheScreen();
  });

  it('records the crop and plot', async () => {
    const view = await renderScreen(<PlantingForm />);
    await pick('Okra');
    await pick('Duol sa suba');
    await press('Save');
    expect(
      view.db
        .prepare(
          `select c.crop_id, p.name, c.status from cycle c join plot p on p.id = c.plot_id
           order by c.rowid desc limit 1`,
        )
        .get(),
    ).toEqual({ crop_id: 'crop-okra', name: 'Duol sa suba', status: 'growing' });
  });
});
