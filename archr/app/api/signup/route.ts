// import { NextResponse } from "next/server";
// // import { createClient } from '@supabase/supabase-js'

// // const supabase = createClient(

// // )

// export async function POST(req: Request) {

//     const { email, password } = await req.json()

//     if (!email || !password) {
//         return NextResponse.json({ error: 'Missing fields'}, { status: 400} )
//     }


//     const {data, error} = await supabase.auth.admin.createUser({
//         email,
//         password
//     })



// }