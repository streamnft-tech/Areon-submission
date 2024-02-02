import { useMemo } from "react";

const StarfilledsmoothinnercornerImage = ({
  starfilledsmoothinnercornTop,
  starfilledsmoothinnercornRight,
  starfilledsmoothinnercornZIndex,
}) => {
  const starfilledsmoothinnercornerIconStyle = useMemo(() => {
    return {
      top: starfilledsmoothinnercornTop,
      right: starfilledsmoothinnercornRight,
      zIndex: starfilledsmoothinnercornZIndex,
    };
  }, [
    starfilledsmoothinnercornTop,
    starfilledsmoothinnercornRight,
    starfilledsmoothinnercornZIndex,
  ]);

  return (
    <img
      className="my-0 mx-[!important] absolute top-[-1038.8px] w-[132.7px] h-[132.7px] object-contain"
      alt=""
      src="./images/starfilledsmoothinnercorner.png"
      style={starfilledsmoothinnercornerIconStyle}
    />
  );
};

export default StarfilledsmoothinnercornerImage;
