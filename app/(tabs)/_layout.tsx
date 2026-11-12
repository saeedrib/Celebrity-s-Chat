import { Redirect } from 'expo-router';

// The previous social-chat tab group is intentionally retired on the BY CLICK
// rebuild branch. Keep legacy source files intact, but do not expose that UI.
export default function LegacyTabsRedirect() {
  return <Redirect href="/dashboard" />;
}
