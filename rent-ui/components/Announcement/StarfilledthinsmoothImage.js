import { useMemo } from "react";


const StarfilledthinsmoothImage = ({
  starfilledthinsmoothIconTop,
  starfilledthinsmoothIconLeft,
  starfilledthinsmoothIconZIndex,
}) => {
  const starfilledthinsmoothIconStyle = useMemo(() => {
    return {
      top: starfilledthinsmoothIconTop,
      left: starfilledthinsmoothIconLeft,
      zIndex: starfilledthinsmoothIconZIndex,
    };
  }, [
    starfilledthinsmoothIconTop,
    starfilledthinsmoothIconLeft,
    starfilledthinsmoothIconZIndex,
  ]);

  return (
    <img
      className="my-0 mx-[!important] absolute top-[-987.5px] left-[1572px] w-[92.4px] h-[92.4px] object-contain"
      alt=""
      src="/images/starfilledthinsmooth.png"
      style={starfilledthinsmoothIconStyle}
    />
  );
};

export default StarfilledthinsmoothImage;
