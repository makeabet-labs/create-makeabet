import {
  Anchor,
  Badge,
  Button,
  Card,
  Container,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
  ThemeIcon,
  rem,
} from '@mantine/core';
import { IconBolt, IconChartLine, IconShare3 } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from '../i18n';
import './LandingPage.css';

const featureIcons = {
  speed: IconBolt,
  transparency: IconChartLine,
  social: IconShare3,
} as const;

export function LandingPage() {
  const { t } = useTranslation();

  useEffect(() => {
    document.body.classList.add('landing-page-root');
    return () => {
      document.body.classList.remove('landing-page-root');
    };
  }, []);

  const features = [
    {
      key: 'speed',
      title: t('landing.features.speed.title'),
      description: t('landing.features.speed.description'),
    },
    {
      key: 'transparency',
      title: t('landing.features.transparency.title'),
      description: t('landing.features.transparency.description'),
    },
    {
      key: 'social',
      title: t('landing.features.social.title'),
      description: t('landing.features.social.description'),
    },
  ] as const;

  return (
    <Stack h="100vh" justify="space-between" gap={0} className="landing-page">
      <Container size="lg" py="lg">
        <Group justify="space-between" align="center">
          <Group gap="xs">
            <Badge variant="filled" size="lg" radius="md">
              {t('landing.brand')}
            </Badge>
            <Text c="dimmed" fz="sm">
              {t('landing.tagline')}
            </Text>
          </Group>
          <Group gap="xs">
            <Button variant="subtle" component={Link} to="/app">
              {t('landing.launch')}
            </Button>
          </Group>
        </Group>
      </Container>

      <Container size="lg" py="xl">
        <SimpleGrid
          cols={{ base: 1, md: 2 }}
          spacing="xl"
          align="center"
          className="landing-hero-grid"
        >
          <Stack gap="lg">
            <Badge variant="light" color="teal" size="lg" radius="sm" w="fit-content">
              {t('landing.hero.badge')}
            </Badge>
            <Title order={1} ff="inherit">
              {t('landing.hero.title')}
            </Title>
            <Text fz="lg" c="dimmed">
              {t('landing.hero.subtitle')}
            </Text>
            <Group gap="md">
              <Button size="lg" radius="md" component={Link} to="/app">
                {t('landing.hero.primaryCta')}
              </Button>
              <Button
                size="lg"
                variant="light"
                radius="md"
                component={Anchor}
                href="https://pyth.network"
                target="_blank"
                rel="noreferrer"
              >
                {t('landing.hero.secondaryCta')}
              </Button>
            </Group>
          </Stack>

          <div className="landing-hero-visual">
            <div className="landing-hero-banner">
              <div className="landing-hero-overlay" />
              <div className="landing-hero-glow landing-hero-glow-one" />
              <div className="landing-hero-glow landing-hero-glow-two" />
              <div className="landing-hero-orbit landing-hero-orbit-one">
                <span className="landing-hero-node" />
              </div>
              <div className="landing-hero-orbit landing-hero-orbit-two">
                <span className="landing-hero-node" />
              </div>
              <Stack gap="sm" className="landing-hero-text">
                <Text fw={700} fz={rem(26)}>
                  {t('landing.hero.banner.title')}
                </Text>
                <Text c="dimmed" maw={380}>
                  {t('landing.hero.banner.description')}
                </Text>
              </Stack>
            </div>
          </div>
        </SimpleGrid>
        <Stack gap="lg" mt={60}>
          <Title order={3}>{t('landing.features.title')}</Title>
          <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
            {features.map((feature) => {
              const Icon = featureIcons[feature.key as keyof typeof featureIcons];
              return (
                <Card key={feature.key} radius="md" withBorder shadow="sm" p="lg">
                  <Stack gap="sm" align="flex-start">
                    <ThemeIcon size="xl" radius="md" variant="light" color="teal">
                      <Icon size={24} />
                    </ThemeIcon>
                    <Text fw={600}>{feature.title}</Text>
                    <Text c="dimmed" fz="sm">
                      {feature.description}
                    </Text>
                  </Stack>
                </Card>
              );
            })}
          </SimpleGrid>
        </Stack>
      </Container>

      <Container size="lg" py="md">
        <Group justify="space-between" align="center">
          <Text fz="sm" c="dimmed">
            {t('landing.footer.tagline')}
          </Text>
          <Group gap="md">
            <Anchor href="https://docs.pyth.network" target="_blank" rel="noreferrer" fz="sm">
              {t('landing.footer.linkPyth')}
            </Anchor>
            <Anchor href="/docs/pyth-integration.md" target="_blank" rel="noreferrer" fz="sm">
              {t('landing.footer.linkDocs')}
            </Anchor>
          </Group>
        </Group>
      </Container>
    </Stack>
  );
}
