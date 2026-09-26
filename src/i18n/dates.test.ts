import { formatDate, formatDateLong, formatMonthShort, formatMonthYear, weekOf } from './dates';

describe('dates', () => {
  it('writes a short date in either language', () => {
    expect(formatDate('2026-09-26', 'en')).toBe('Sep 26');
    expect(formatDate('2026-08-03', 'bis')).toBe('Ago 3');
  });

  it('writes the full date with its weekday', () => {
    expect(formatDateLong('2026-09-26', 'en')).toBe('Saturday, September 26');
    expect(formatDateLong('2026-09-26', 'bis')).toBe('Sabado, Septiyembre 26');
  });

  it('names months', () => {
    expect(formatMonthShort('2026-01', 'bis')).toBe('Ene');
    expect(formatMonthYear('2026-12-05', 'en')).toBe('December 2026');
  });

  it('builds the Sunday-to-Saturday week around a day', () => {
    const week = weekOf('2026-09-30', 'en');
    expect(week.map((d) => d.date)).toEqual([
      '2026-09-27',
      '2026-09-28',
      '2026-09-29',
      '2026-09-30',
      '2026-10-01',
      '2026-10-02',
      '2026-10-03',
    ]);
    expect(week[0]).toEqual({ date: '2026-09-27', weekday: 'Su', spoken: 'Sunday, September 27' });
  });

  it('starts the week on the day itself when it is a Sunday', () =>
    expect(weekOf('2026-09-27', 'bis')[0].date).toBe('2026-09-27'));
});
