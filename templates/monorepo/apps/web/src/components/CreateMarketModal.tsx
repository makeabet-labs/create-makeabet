import { useState } from 'react';
import { Modal, Stack, Text, Group, Button, NumberInput, Select, Textarea } from '@mantine/core';
import { DateTimePicker } from '@mantine/dates';
import { IconCalendar } from '@tabler/icons-react';

interface CreateMarketModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (marketData: {
    symbol: string;
    currentPrice: number;
    targetPrice: number;
    expiryTime: Date;
    question: string;
    feedId: string;
  }) => void;
  symbol?: string;
  currentPrice?: number;
  feedId?: string;
}

export function CreateMarketModal({
  opened,
  onClose,
  onSubmit,
  symbol = '',
  currentPrice = 0,
  feedId = '',
}: CreateMarketModalProps) {
  const [targetPrice, setTargetPrice] = useState<number>(currentPrice * 1.1);
  const [expiryTime, setExpiryTime] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  );
  const [question, setQuestion] = useState<string>(
    `Will ${symbol} reach $${(currentPrice * 1.1).toFixed(2)}?`
  );
  const [direction, setDirection] = useState<string>('above');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Generate question based on direction
      const generatedQuestion = direction === 'above'
        ? `Will ${symbol} reach $${targetPrice.toFixed(2)} or higher?`
        : `Will ${symbol} stay below $${targetPrice.toFixed(2)}?`;

      await onSubmit({
        symbol,
        currentPrice,
        targetPrice,
        expiryTime,
        question: question || generatedQuestion,
        feedId,
      });
      
      onClose();
      // Reset form
      setTargetPrice(currentPrice * 1.1);
      setExpiryTime(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
      setQuestion('');
    } catch (error) {
      console.error('Failed to create market:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update question when inputs change
  const updateQuestion = (price: number, dir: string) => {
    const generatedQuestion = dir === 'above'
      ? `Will ${symbol} reach $${price.toFixed(2)} or higher?`
      : `Will ${symbol} stay below $${price.toFixed(2)}?`;
    setQuestion(generatedQuestion);
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create New Market"
      size="md"
      centered
    >
      <Stack gap="lg">
        {/* Asset Info */}
        <Stack gap="xs">
          <Text fw={600} size="lg">
            {symbol}
          </Text>
          <Text size="sm" c="dimmed">
            Current Price: ${currentPrice.toFixed(2)}
          </Text>
        </Stack>

        {/* Direction Selection */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Prediction Direction
          </Text>
          <Select
            value={direction}
            onChange={(value) => {
              setDirection(value || 'above');
              updateQuestion(targetPrice, value || 'above');
            }}
            data={[
              { value: 'above', label: '📈 Price will go above target' },
              { value: 'below', label: '📉 Price will stay below target' },
            ]}
          />
        </Stack>

        {/* Target Price */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Target Price
          </Text>
          <NumberInput
            value={targetPrice}
            onChange={(val) => {
              const price = Number(val) || 0;
              setTargetPrice(price);
              updateQuestion(price, direction);
            }}
            min={0}
            step={currentPrice * 0.01}
            placeholder="Enter target price"
            leftSection="$"
            decimalScale={2}
          />
          <Text size="xs" c="dimmed">
            {direction === 'above' 
              ? `${((targetPrice / currentPrice - 1) * 100).toFixed(1)}% above current price`
              : `${((1 - targetPrice / currentPrice) * 100).toFixed(1)}% below current price`
            }
          </Text>
        </Stack>

        {/* Expiry Time */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Expiry Time
          </Text>
          <DateTimePicker
            value={expiryTime}
            onChange={(date) => setExpiryTime(date || new Date())}
            minDate={new Date()}
            placeholder="Select expiry time"
            leftSection={<IconCalendar size={16} />}
          />
          <Text size="xs" c="dimmed">
            Market will close at this time
          </Text>
        </Stack>

        {/* Question */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Market Question
          </Text>
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.currentTarget.value)}
            placeholder="Enter market question"
            minRows={2}
            maxRows={4}
          />
          <Text size="xs" c="dimmed">
            This will be displayed to users
          </Text>
        </Stack>

        {/* Preview */}
        <Stack gap="xs" p="md" style={{ background: 'var(--mantine-color-gray-0)', borderRadius: '8px' }}>
          <Text size="xs" fw={600} c="dimmed">
            PREVIEW
          </Text>
          <Text size="sm" fw={500}>
            {question}
          </Text>
          <Group gap="xs">
            <Text size="xs" c="dimmed">
              Target: ${targetPrice.toFixed(2)}
            </Text>
            <Text size="xs" c="dimmed">
              •
            </Text>
            <Text size="xs" c="dimmed">
              Expires: {expiryTime.toLocaleDateString()}
            </Text>
          </Group>
        </Stack>

        {/* Action Buttons */}
        <Group justify="space-between" mt="md">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={!question || targetPrice <= 0}
          >
            Create Market
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
