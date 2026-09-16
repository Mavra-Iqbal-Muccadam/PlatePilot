import { Suspense } from "react";
import MenuPage from "../../src/screens/Menu";

export default function AllFoodsPage() {
  return (
    <Suspense fallback={null}>
      <MenuPage />
    </Suspense>
  );
}
