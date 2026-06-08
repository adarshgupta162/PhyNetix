import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PlatformSettings {
  show_pdf_tests: boolean;
  show_leaderboard: boolean;
  allow_signups: boolean;
  maintenance_mode: boolean;
  [key: string]: boolean;
}

const defaultSettings: PlatformSettings = {
  show_pdf_tests: true,
  show_leaderboard: true,
  allow_signups: true,
  maintenance_mode: false,
};

export function usePlatformSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('key, value');

    if (!error && data) {
      const parsed: PlatformSettings = { ...defaultSettings };
      data.forEach((row: any) => {
        parsed[row.key] = row.value === true || row.value === 'true';
      });
      setSettings(parsed);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSetting = useCallback(async (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    const { error } = await supabase
      .from('platform_settings')
      .update({ value: value as any, updated_at: new Date().toISOString() })
      .eq('key', key);

    if (error) {
      // Revert on error
      setSettings(prev => ({ ...prev, [key]: !value }));
    }
    
    return !error;
  }, []);

  return { settings, loading, updateSetting, refetch: fetchSettings };
}
