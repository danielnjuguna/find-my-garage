import React, { useState } from "react";
import { toast } from "sonner";
import VideoUpload from "@/components/VideoUpload";
import SearchResults from "@/components/SearchResults";
import { extractFrames } from "@/utils/videoUtils";
import { initializeGemini, analyzeImage } from "@/services/geminiService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";

interface SearchResult {
  frameIndex: number;
  timestamp: string;
  description: string;
  frameUrl: string;
}

const Index = () => {
  const [frames, setFrames] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const handleVideoSelect = async (file: File) => {
    try {
      const extractedFrames = await extractFrames(file);
      setFrames(extractedFrames);
      toast.success(`Extracted ${extractedFrames.length} frames`);
    } catch (error) {
      toast.error("Error processing video");
      console.error(error);
    }
  };

  const handleSearch = async () => {
    if (!apiKey) {
      toast.error("Please enter your Gemini API key");
      return;
    }

    if (!searchQuery) {
      toast.error("Please enter a search query");
      return;
    }

    if (frames.length === 0) {
      toast.error("Please upload a video first");
      return;
    }

    setIsAnalyzing(true);
    setResults([]);

    try {
      initializeGemini(apiKey);
      const searchResults: SearchResult[] = [];
      const batchSize = 5; // Process 5 frames at a time
      const delayBetweenBatches = 6000; // 6 seconds between batches to stay under rate limit

      for (let i = 0; i < frames.length; i += batchSize) {
        const batch = frames.slice(i, i + batchSize);
        const batchPromises = batch.map(async (frame, batchIndex) => {
          try {
            const description = await analyzeImage(frame, searchQuery);
            if (description.toLowerCase() !== "not found") {
              searchResults.push({
                frameIndex: i + batchIndex,
                timestamp: `${Math.floor((i + batchIndex) / 1)}s`,
                description,
                frameUrl: frame,
              });
            }
          } catch (error: any) {
            console.error(`Error analyzing frame ${i + batchIndex}:`, error);
            // Don't throw here, just log the error and continue with other frames
          }
        });

        await Promise.all(batchPromises);
        
        // Only delay if there are more frames to process
        if (i + batchSize < frames.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }

      setResults(searchResults);
      if (searchResults.length === 0) {
        toast.info(`No ${searchQuery} found in the video`);
      } else {
        toast.success(
          `Found ${searchQuery} in ${searchResults.length} frame${
            searchResults.length === 1 ? "" : "s"
          }`
        );
      }
    } catch (error: any) {
      toast.error(error.message || "Error analyzing frames");
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-display font-bold">Video Object Finder</h1>
          <p className="text-muted-foreground">
            Upload a video and search for specific objects within it
          </p>
        </div>

        <div className="space-y-4">
          <Input
            type="password"
            placeholder="Enter your Gemini API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="max-w-md mx-auto"
          />
          <VideoUpload onVideoSelect={handleVideoSelect} />
        </div>

        <div className="flex gap-4">
          <Input
            placeholder="What object are you looking for?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            disabled={isAnalyzing}
            className="min-w-[100px]"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">{isAnalyzing ? "Analyzing" : "Search"}</span>
          </Button>
        </div>

        <SearchResults results={results} />
      </div>
    </div>
  );
};

export default Index;