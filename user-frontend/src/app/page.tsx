
import Appbar from "@/components/Appbar";
import { UploadImage } from "@/components/UploadImage";
export default function Home() {
  return (
    <main>
      <Appbar />
      <div>
        hi there from main page
      </div>

      <UploadImage />
      
    </main>
  );
}
