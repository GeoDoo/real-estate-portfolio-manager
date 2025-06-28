import PageContainer from "@/components/PageContainer";
import Breadcrumbs from "@/components/Breadcrumbs";
import NewPropertyForm from "@/features/properties/NewPropertyForm";

export default function NewPropertyPage() {
  return (
    <PageContainer>
      <Breadcrumbs last="Add New Property" />
      <h1 className="text-3xl font-bold mb-8">Add New Property</h1>
      <NewPropertyForm />
    </PageContainer>
  );
}
