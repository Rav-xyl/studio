import { InterviewPage } from "@/components/interview/interview-page";

export default function Page({ params }: { params: { id: string } }) {
    return <InterviewPage candidateId={params.id} />
}
