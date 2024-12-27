import React, { useState } from "react";
import { toast } from "sonner";
import VideoUpload from "@/components/VideoUpload";
import SearchResults from "@/components/SearchResults";
import { extractFrames } from "@/utils/videoUtils";
import { initializeGemini, analyzeVideo } from "@/services/geminiService";
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
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiKey, setApiKey] = useState("");

  const handleVideoSelect = async (file: File) => {
    setVideoFile(file);
    toast.success("Video uploaded successfully");
  };

  const parseTimestamp = (timestamp: string): number => {
    // Handle different timestamp formats
    const timeMatch = timestamp.match(/(\d+):(\d+)/);
    if (timeMatch) {
      const minutes = parseInt(timeMatch[1]);
      const seconds = parseInt(timeMatch[2]);
      return minutes * 60 + seconds;
    }
    const secondsMatch = timestamp.match(/(\d+)s/);
    if (secondsMatch) {
      return parseInt(secondsMatch[1]);
    }
    return 0;
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

    if (!videoFile) {
      toast.error("Please upload a video first");
      return;
    }

    setIsAnalyzing(true);
    setResults([]);

    try {
      initializeGemini(apiKey);
      const analysisResult = await analyzeVideo(videoFile, searchQuery);
      console.log("Analysis result:", analysisResult);

      // Extract frames from the video
      const frames = await extractFrames(videoFile);
      console.log("Extracted frames:", frames.length);

      // Parse the analysis result to find timestamps
      const timestampRegex = /(\d+:\d+|\d+s)/g;
      const matches = analysisResult.split('\n').filter(line => 
        line.match(timestampRegex) && line.toLowerCase().includes(searchQuery.toLowerCase())
      );

      if (matches && matches.length > 0) {
        const searchResults: SearchResult[] = matches.map((match, index) => {
          const timestampMatch = match.match(timestampRegex);
          const timestamp = timestampMatch ? timestampMatch[0] : `${index}s`;
          const description = match.replace(timestampRegex, '').trim();
          
          // Convert timestamp to frame index
          const seconds = parseTimestamp(timestamp);
          const frameIndex = Math.floor(seconds * (frames.length / videoFile.duration));
          
          return {
            frameIndex,
            timestamp,
            description,
            frameUrl: frames[frameIndex] || frames[0],
          };
        });

        setResults(searchResults);
        toast.success(`Found ${searchResults.length} occurrences of ${searchQuery}`);
      } else {
        toast.info(`No ${searchQuery} found in the video`);
      }
    } catch (error: any) {
      toast.error(error.message || "Error analyzing video");
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