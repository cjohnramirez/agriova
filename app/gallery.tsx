import { Redirect } from 'expo-router';
import {
  Bell,
  Globe,
  HelpCircle,
  LogOut,
  MapPin,
  Plus,
  SlidersHorizontal,
  Sprout,
  Thermometer,
  Wallet,
} from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { color, space } from '@/theme/tokens';
import {
  AlertCard,
  Button,
  Card,
  ChatBubble,
  ChoiceCard,
  ChoicePills,
  Chip,
  EmptyState,
  Field,
  FilterPills,
  GradientCard,
  IconButton,
  ListRow,
  Logo,
  MetricTile,
  ProductCard,
  Screen,
  Sparkline,
  StepChart,
  Text,
  TextField,
  Tiles,
  TopBar,
  useBreakpoint,
  WeekStrip,
} from '@/ui';

/**
 * Development-only catalogue of every primitive, arranged like the Figma
 * screens so emulator screenshots can be compared against the design. Strings
 * here are sample data, not product copy, so they bypass i18n on purpose.
 */
export default function Gallery() {
  const { isNarrow } = useBreakpoint();
  const [day, setDay] = useState('2026-05-15');
  const [spentOn, setSpentOn] = useState<'seed' | 'fertilizer' | 'labor' | null>(null);
  const [filter, setFilter] = useState<'all' | 'seeds' | 'fertilizer' | 'tools'>('all');

  if (!__DEV__) return <Redirect href="/" />;

  const noop = () => {};
  const days = [12, 13, 14, 15, 16, 17, 18].map((d, i) => ({
    date: `2026-05-${d}`,
    weekday: ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'][i],
    spoken: `May ${d}`,
  }));

  return (
    <Screen
      header={
        <TopBar
          greeting="Welcome back"
          name="Francis Adrian Esteban"
          avatarLabel="Account settings"
          onPressAvatar={noop}
          actions={<IconButton icon={Bell} label="Notifications" onPress={noop} badge />}
        />
      }
    >
      <Section title="Brand">
        <View style={styles.row}>
          <Logo variant="wordmark" height={36} />
        </View>
      </Section>

      <Section title="Hero">
        <GradientCard padding="hero">
          <Text variant="label" tone="onBrand">
            Earnings this season
          </Text>
          <Text variant="display" tone="onBrand" numeric>
            ₱9,250
          </Text>
          <View style={styles.row}>
            <Chip tone="onCard" label="Tomato · Plot 1" />
            <Chip tone="onCard" label="Harvest in 12 days" />
          </View>
        </GradientCard>
      </Section>

      <Section title="Metrics">
        <Card>
          <View style={styles.between}>
            <Text variant="bodyStrong">Finances</Text>
            <Wallet size={22} color={color.accent} />
          </View>
          <StepChart
            values={[3, 4, 3.5, 5, 6, 5.5, 7, 7.5, 6.5, 6]}
            accessibilityLabel="Net earnings rose over 30 days, with two small dips"
          />
          <View style={styles.between}>
            <View>
              <Text tone="muted">Last 30 days</Text>
              <Text variant="figure" tone="accent" numeric>
                ₱18,850
              </Text>
            </View>
            <View style={styles.right}>
              <Text tone="muted" numeric>
                Spent ₱9,600
              </Text>
              <Text tone="muted" numeric>
                Sold ₱18,850
              </Text>
            </View>
          </View>
        </Card>
        <View style={[styles.tiles, isNarrow && styles.stack]}>
          <Card style={styles.tile}>
            <View style={styles.between}>
              <Text variant="bodyStrong">Heat today</Text>
              <Thermometer size={22} color={color.accent} />
            </View>
            <Text variant="figure" numeric>
              41°C
            </Text>
            <Sparkline
              values={[33, 36, 39, 41, 40, 38]}
              accessibilityLabel="Temperature peaks at 41 at 1pm"
            />
          </Card>
          <GradientCard style={styles.tile}>
            <View style={styles.between}>
              <Text variant="bodyStrong" tone="onBrand">
                Sell soon
              </Text>
              <Sprout size={22} color={color.textOnBrand} />
            </View>
            <Text variant="figure" tone="onBrand" numeric>
              2 days
            </Text>
            <Text tone="onBrand">Tomatoes from 14 Aug start to spoil.</Text>
          </GradientCard>
        </View>
      </Section>

      <Section title="Schedule">
        <WeekStrip days={days} selected={day} onSelect={setDay} />
        <AlertCard
          kind="suggest"
          title="Today’s plan"
          body="Peak heat from 11am to 4pm. Spray in the early morning and plant in the evening."
        />
        <Card>
          <Text variant="bodyStrong">Urea fertilizer, Plot 1</Text>
          <View style={styles.row}>
            <Chip label="8:00 to 9:30 AM" />
            <Chip label="Rice field" dot={color.accent} />
          </View>
          <AlertCard
            kind="warning"
            title="Heat warning"
            body="Extreme heat will make the fertilizer evaporate."
            action={{ label: 'Move to evening', onPress: noop }}
          />
          <AlertCard
            kind="approve"
            title="Good to go"
            body="Soil is moist enough. Water before the sun peaks."
          />
        </Card>
        <Button variant="secondary" icon={Plus} label="Add task" onPress={noop} />
      </Section>

      <Section title="Shop filters">
        <FilterPills
          label="Filter products"
          selected={filter}
          onSelect={setFilter}
          options={[
            { key: 'all', label: 'All' },
            { key: 'seeds', label: 'Seeds' },
            { key: 'fertilizer', label: 'Fertilizers' },
            { key: 'tools', label: 'Tools' },
          ]}
        />
      </Section>

      <Section title="Settings rows">
        <Card gap="none">
          <ListRow icon={MapPin} title="Saved addresses" onPress={noop} />
          <ListRow icon={Globe} title="Language" value="Binisaya" onPress={noop} />
          <ListRow icon={HelpCircle} title="Help center" onPress={noop} />
          <ListRow icon={LogOut} title="Log out" tone="danger" onPress={noop} />
        </Card>
      </Section>

      <Section title="Buttons">
        <Button label="Save expense" onPress={noop} block />
        <Button variant="secondary" icon={SlidersHorizontal} label="Filters" onPress={noop} />
        <Button label="Disabled" onPress={noop} disabled />
      </Section>

      <Section title="Forms">
        <TextField label="Mobile number" prefix="+63" size="large" placeholder="9XX XXX XXXX" />
        <TextField label="Barangay" hint="Where your farm is." />
        <TextField label="Plot name" error="Please fill this in." />
        <ChoiceCard
          icon={Wallet}
          title="Expense"
          hint="Money you spent on the farm"
          onPress={noop}
        />
        <ChoiceCard title="Binisaya" selected onPress={noop} />
        <Field label="Spent on" error={spentOn ? null : 'Choose one.'}>
          <ChoicePills
            label="Spent on"
            selected={spentOn}
            onSelect={setSpentOn}
            options={[
              { key: 'seed', label: 'Seeds' },
              { key: 'fertilizer', label: 'Fertilizer' },
              { key: 'labor', label: 'Labor' },
            ]}
          />
        </Field>
      </Section>

      <Section title="Data">
        <Tiles>
          <MetricTile icon={MapPin} label="Plots" value="2" caption="1.1 ha" />
          <MetricTile icon={Sprout} label="Growing now" value="3" />
        </Tiles>
        <View style={[styles.tiles, isNarrow && styles.stack]}>
          <ProductCard
            name="Pioneer hybrid yellow corn"
            price="₱4,200"
            per="per 18 kg bag"
            seller="Claveria Seed Dist."
            onPress={noop}
          />
          <ProductCard
            name="Drip irrigation tape"
            price="₱850"
            per="per roll"
            seller="Gingoog Farmers Coop"
            onPress={noop}
          />
        </View>
        <ChatBubble from="farmer" text="When should I sell my tomatoes?" />
        <ChatBubble
          from="assistant"
          text="Prices in Carmen are highest on Saturday. Sell the ripest first."
        />
      </Section>

      <Section title="Empty state">
        <EmptyState
          icon={Sprout}
          title="No plots yet"
          body="Add your first plot to start tracking this season."
          action={{ label: 'Add a plot', onPress: noop }}
        />
      </Section>
    </Screen>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text variant="heading">{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  between: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  right: { alignItems: 'flex-end' },
  tiles: { flexDirection: 'row', gap: space.md },
  stack: { flexDirection: 'column' },
  tile: { flex: 1 },
});
