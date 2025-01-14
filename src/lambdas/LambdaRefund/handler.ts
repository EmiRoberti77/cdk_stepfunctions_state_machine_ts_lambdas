export const handler = async (event: any) => {
  console.log("Refund lambda");
  return {
    status: "success",
    message: "Refund processes",
    event,
  };
};
