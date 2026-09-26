import { Redirect, useLocalSearchParams } from 'expo-router';

import { ExpenseForm } from '@/features/record/ExpenseForm';
import { HarvestForm } from '@/features/record/HarvestForm';
import { PlantingForm } from '@/features/record/PlantingForm';
import { SaleForm } from '@/features/record/SaleForm';

const FORMS = {
  expense: ExpenseForm,
  harvest: HarvestForm,
  sale: SaleForm,
  planting: PlantingForm,
} as const;

/** The record forms, one route: `/record/expense`, `/record/sale`, and so on. */
export default function RecordRoute() {
  const { kind } = useLocalSearchParams<{ kind: string }>();
  const Form = FORMS[kind as keyof typeof FORMS];
  return Form ? <Form /> : <Redirect href="/" />;
}
