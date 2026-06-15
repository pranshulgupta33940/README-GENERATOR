import { Button } from "../ui/button";

interface CTAProps {
  onGenerateClick: () => void;
}

export default function CTA({ onGenerateClick }: CTAProps) {
  const handleClick = () => {
    // Scroll to top to show the form and trigger generate click
    window.scrollTo({ top: 0, behavior: "smooth" });
    onGenerateClick();
  };

  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-extrabold w-[90%] mx-auto md:w-full">
        Done Writing Docs? Let AI Take Over.
      </h1>
      <h2 className="text-gray-600 py-4 md:w-1/3 w-8/12 mx-auto">
        Instantly turn your GitHub repo into a polished README. Save time, stay
        focused on building.
      </h2>
      <Button
        onClick={handleClick}
        variant="outline"
        className="h-10 px-6 py-2.5 rounded-lg text-base
              bg-gradient-to-r from-rose-100 to-pink-100 
              text-rose-600 hover:text-rose-600 font-medium transition-all duration-200
              border border-rose-200/50 
              hover:bg-rose-50 hover:border-rose-500
              active:bg-rose-100
              cursor-pointer shadow-lg shadow-rose-200"
      >
        🚀 Generate My README →
      </Button>
    </div>
  );
}
