import { Profile } from "@/components/Profile";
import ProtectedRoute from "@/components/ProtectedRoute";

const page = () => {

  return (
    <ProtectedRoute>
      <div className="flex flex-col justify-end items-center w-full h-full">
      <Profile />
      </div>
    </ProtectedRoute>
  );
}

export default page;