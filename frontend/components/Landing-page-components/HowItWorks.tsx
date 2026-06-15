import {
  BrainCircuit,
  FileOutput,
  Link,
  MoveRight,
  ArrowDown,
} from "lucide-react";

export default function HowItWorks() {
  return (
    <div className="md:py-16 py-8 mt-4">
      <h1 className="text-center text-3xl font-bold text-rose-500 mb-12">
        How It Works
      </h1>
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-center gap-10 md:gap-0 md:space-x-8">
          {/* Step 1 */}
          <div className="flex flex-col items-center text-center flex-1">
            <div className="mb-4 flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-100/60 shadow-md">
              <Link className="h-8 w-8 text-rose-500" />
            </div>
            <div className="font-bold text-lg text-gray-900 mb-1">
              Paste Your Repository Link
            </div>
            <div className="text-gray-500 text-sm">
              Just drop your GitHub repo URL
            </div>
          </div>

          {/* Arrow 1 */}
          <div className="md:mx-4 flex flex-col items-center justify-center">
            <ArrowDown className="h-6 w-6 text-rose-200 block md:hidden" />
            <MoveRight
              size={32}
              className="h-6 w-6 text-rose-200 hidden md:block"
            />
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center text-center flex-1">
            <div className="mb-4 flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-100/60 shadow-md">
              <BrainCircuit className="h-8 w-8 text-rose-500" />
            </div>
            <div className="font-bold text-lg text-gray-900 mb-1">
              Let AI Analyze & Generate
            </div>
            <div className="text-gray-500 text-sm">
              Our AI reads your codebase, then crafts a tailored README.md.
            </div>
          </div>

          {/* Arrow 2 */}
          <div className="md:mx-4 flex flex-col items-center justify-center">
            <ArrowDown className="h-6 w-6 text-rose-200 block md:hidden" />
            <MoveRight
              size={32}
              className="h-6 w-6 text-rose-200 hidden md:block"
            />
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center text-center flex-1">
            <div className="mb-4 flex items-center justify-center h-16 w-16 rounded-2xl bg-rose-100/60 shadow-md">
              <FileOutput className="h-8 w-8 text-rose-500" />
            </div>
            <div className="font-bold text-lg text-gray-900 mb-1">
              Get Your Polished README
            </div>
            <div className="text-gray-500 text-sm">
              Download or copy your clean, professional README
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
