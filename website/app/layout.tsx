// Root layout - passthrough for next-intl [locale] layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children as React.ReactElement;
}
