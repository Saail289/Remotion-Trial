import { Composition } from "remotion";
import { GeneratedVideo } from "./compositions/Generated";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="GeneratedVideo"
        component={GeneratedVideo}
        durationInFrames={150}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
