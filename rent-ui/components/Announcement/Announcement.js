import StarfilledthinsmoothImage from "./StarfilledthinsmoothImage";
import StarfilledsmoothinnercornerImage from "./StarfilledsmoothinnercornerImage";


const Announcement = () => {

  // const ann="./Images/announcement.png"
  return (
    <div className="absolute top-[0px] left-[0px] bg-green-2-500 w-[100%] h-11 overflow-hidden flex flex-row items-center justify-center py-3.5 px-0 box-border gap-[16px] text-left text-base text-green-2-50 font-numans-400-regular" style={{ background: '#30B750'}}>
      <img
        className="relative w-8 h-8 overflow-hidden shrink-0 object-cover z-[0]"
        alt=""
        src="/images/announcement.png"
      />
      <div className="relative z-[1]">
        Renting and loaning made simpler with the new update
      </div>
      <img
        className="absolute my-0 mx-[!important] top-[15.2px] left-[1180.2px] w-[39.7px] h-[39.7px] object-contain z-[2]"
        alt=""
        src="/images/starfilledplain.png"
      />
      <StarfilledthinsmoothImage
        starfilledthinsmoothIconTop="-38px"
        starfilledthinsmoothIconLeft="48px"
        starfilledthinsmoothIconZIndex="3"
      />
      <img
        className="absolute my-0 mx-[!important] top-[1.2px] left-[calc(50%_-_420.8px)] w-[57.4px] h-[57.4px] object-contain z-[4]"
        alt=""
         src="/images/starfilledsmoothray.png"
      />
      <img
        className="absolute my-0 mx-[!important] top-[-5.6px] left-[1024px] w-[47.5px] h-[49.3px] object-contain z-[5]"
        alt=""
        src="/images/starfilledlong.png"
      />
      <StarfilledsmoothinnercornerImage
        starfilledsmoothinnercornTop="-63.8px"
        starfilledsmoothinnercornRight="-36.1px"
        starfilledsmoothinnercornZIndex="6"
      />
    </div>
  );
};

export default Announcement;
