import { useAppBridge } from "@shopify/app-bridge-react";
import { Page, Card, Text } from "@shopify/polaris";
import { useEffect } from "react";

export default function Products() {
  const app = useAppBridge();

  useEffect(() => {
    app.getState().then((state) => {
      console.log("AppBridge state:", state);
    });
  }, [app]);

  return (
    <Page title="Products">
      <Card sectioned>
        <Text variant="bodyMd">Here is your products page.</Text>
      </Card>
    </Page>
  );
}
