import { TbTruckDelivery } from "react-icons/tb";
import { FaArrowRotateLeft } from "react-icons/fa6";
import { IoShieldCheckmarkOutline } from "react-icons/io5";

const shopwithUs = [
    {
        icons: <TbTruckDelivery className="w-8 h-8" />,
        title: "Delivery in Ghana",
        text: "We deliver across Ghana. Delivery options are confirmed at checkout."
    },
    {
        icons: <FaArrowRotateLeft className="w-8 h-8" />,
        title: "7-Day Returns",
        text: "Return eligible items within 7 days. See our Refund & Return Policy."
    },
    {
        icons: <IoShieldCheckmarkOutline className="w-8 h-8" />,
        title: "Warranty Support",
        text: "Where a manufacturer's warranty applies, we help you make a claim."
    }
]

export function ShopwithUs() {
    return (
      <div className="w-full ">
        <div className="mx-auto flex justify-between items-start gap-1">
          {shopwithUs.map((item, index) => (
            <div
              key={index}
              className="flex flex-col justify-center items-center text-center"
            >
              {item.icons}
              <h3 className="text-md lg:text-lg mt-2 font-medium">
                {item.title}
              </h3>
         {/*      <p className="mt-2 text-md md:text-lg text-gray-500 dark:text-gray-300">
                {item.text}
              </p> */}
            </div>
          ))}
        </div>
      </div>
    );
  }
  