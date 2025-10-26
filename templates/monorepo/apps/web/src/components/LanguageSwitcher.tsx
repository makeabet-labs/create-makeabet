import { Menu, Button } from '@mantine/core';
import { IconLanguage, IconCheck } from '@tabler/icons-react';
import { useI18n } from '../i18n';

export function LanguageSwitcher() {
  const { locale, locales, setLocale } = useI18n();

  const languageNames: Record<string, string> = {
    'en': 'English',
    'zh-TW': '繁體中文',
  };

  return (
    <Menu shadow="md" width={200} position="bottom-end">
      <Menu.Target>
        <Button
          variant="default"
          size="sm"
          leftSection={<IconLanguage size={16} />}
        >
          {languageNames[locale]}
        </Button>
      </Menu.Target>

      <Menu.Dropdown>
        <Menu.Label>Select Language</Menu.Label>
        {locales.map((lang) => (
          <Menu.Item
            key={lang}
            onClick={() => setLocale(lang)}
            rightSection={locale === lang ? <IconCheck size={16} /> : null}
          >
            {languageNames[lang]}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
