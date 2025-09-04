import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export function useOrganizationLogo() {
  const { profile, impersonatedOrganization, logoUrl, setLogoUrl } = useAuthStore();
  const orgName = impersonatedOrganization || profile?.organization_name;

  useEffect(() => {
    if (!orgName) return;

    const fetchLogo = async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('logo_url')
        .eq('name', orgName)
        .single();
      
      if (!error && data?.logo_url) {
        setLogoUrl(data.logo_url);
      }
    };
    
    fetchLogo();
  }, [orgName, setLogoUrl]);

  // Effet pour synchroniser avec le store au montage
  useEffect(() => {
    const { fetchLogoUrl } = useAuthStore.getState();
    fetchLogoUrl();
  }, []);

  const uploadLogo = async (file: File) => {
    if (!orgName) throw new Error('Pas d\'organisation');

    const ext = file.name.split('.').pop();
    const fileName = `${orgName}/logo_${Date.now()}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from('organization_logos')
      .upload(fileName, file, { upsert: true });
    if (upErr) throw upErr;

    const { data } = supabase.storage.from('organization_logos').getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    const { error: updateErr } = await supabase
      .from('organizations')
      .update({ logo_url: publicUrl })
      .eq('name', orgName);
    
    if (updateErr) throw updateErr;

    // Mettre à jour le store global
    setLogoUrl(publicUrl);
    
    return publicUrl;
  };

  const removeLogo = async () => {
    if (!orgName || !logoUrl) return;

    const fileName = logoUrl.split('/').pop();
    const filePath = `${orgName}/${fileName}`;
    await supabase.storage.from('organization_logos').remove([filePath]);
    await supabase.from('organizations').update({ logo_url: null }).eq('name', orgName);
    setLogoUrl(null);
  };

  return { logoUrl, uploadLogo, removeLogo };
}