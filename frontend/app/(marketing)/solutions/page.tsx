import { redirect } from "next/navigation";

/** Index removed. Keep /solutions as a soft landing on the home solutions strip. */
export default function SolutionsIndexPage() {
  redirect("/#solutions");
}
