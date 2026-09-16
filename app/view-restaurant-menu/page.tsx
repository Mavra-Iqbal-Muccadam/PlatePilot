import { Suspense } from "react";
import FoodDetailsPage from "../../src/screens/FoodDetails";

export default function ViewRestaurantMenuPage() {
  return (
    <Suspense fallback={null}>
      <FoodDetailsPage />
    </Suspense>
  );
}
