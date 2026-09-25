/**
 * The type system already forces both catalogs to have the same keys. These
 * checks cover what types cannot: an empty translation, and a `{placeholder}`
 * that one language forgot, which would show the raw braces to a farmer.
 */
import { catalogs, LANGUAGES, type StringKey } from './strings';

const keys = Object.keys(catalogs.en) as StringKey[];
const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();

describe.each(LANGUAGES)('%s catalog', (language) => {
  it.each(keys)('has a non-empty %s', (key) => {
    expect(catalogs[language][key].trim()).not.toBe('');
  });

  it.each(keys)('keeps the placeholders of %s', (key) => {
    expect(placeholders(catalogs[language][key])).toEqual(placeholders(catalogs.en[key]));
  });
});
