import { Page, Card, Text } from "@shopify/polaris";

export default function Home() {
  return (
    <Page title="Dashboard">
      <Card sectioned>
        <Text variant="bodyMd">Welcome to your embedded Shopify app!</Text>
      </Card>
    </Page>
  );
}
