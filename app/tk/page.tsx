import { Button } from "@/components/ui/button";

export default function TK() {
  return (
    <div className="p-4 text-sm w-full max-w-xl mx-auto text-left mt-8 md:mt-20">
      <Button asChild>
        <a href="sms:+15715716823">text</a>
      </Button>
    </div>
  );
}
