import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchResult {
  frameIndex: number;
  timestamp: string;
  description: string;
  frameUrl: string;
}

interface SearchResultsProps {
  results: SearchResult[];
}

const SearchResults: React.FC<SearchResultsProps> = ({ results }) => {
  if (results.length === 0) return null;

  const extractBoundingBox = (description: string) => {
    const bboxMatch = description.match(/BBOX: (\d+),(\d+),(\d+),(\d+)/);
    if (!bboxMatch) return null;
    return {
      left: `${bboxMatch[1]}%`,
      top: `${bboxMatch[2]}%`,
      width: `${bboxMatch[3]}%`,
      height: `${bboxMatch[4]}%`,
    };
  };

  return (
    <ScrollArea className="h-[400px] w-full rounded-md border p-4">
      <div className="space-y-4">
        {results.map((result, index) => {
          const bbox = extractBoundingBox(result.description);
          return (
            <div
              key={index}
              className="flex items-start space-x-4 p-4 rounded-lg bg-card animate-fade-in"
            >
              <div className="relative">
                <img
                  src={result.frameUrl}
                  alt={`Frame ${result.frameIndex}`}
                  className="w-48 h-auto rounded-md object-cover"
                />
                {bbox && (
                  <div
                    className="absolute border-2 border-red-500 pointer-events-none"
                    style={{
                      left: bbox.left,
                      top: bbox.top,
                      width: bbox.width,
                      height: bbox.height,
                    }}
                  />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-muted-foreground">
                  Timestamp: {result.timestamp}
                </div>
                <p className="mt-1 text-sm">{result.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
};

export default SearchResults;