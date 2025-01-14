export const handler = async (event: any) => {
  console.log("Refund purchase");
  return {
    status: "success",
    message: "Purchase complete",
    event,
  };
};
