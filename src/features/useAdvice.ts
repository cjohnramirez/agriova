import { todayLocal } from '@/db/units';
import { buildAdvice, type Advice } from '@/rules/advice';
import { useForecast } from '@/weather/useForecast';

import { useProduceOnHand } from './useProduceOnHand';

/** Today's on-phone advice: weather and produce rules, most serious first. */
export function useAdvice(): Advice[] {
  const forecast = useForecast();
  const produce = useProduceOnHand();
  return buildAdvice({
    today: todayLocal(),
    nowHour: new Date().getHours(),
    forecast,
    produce,
  });
}
